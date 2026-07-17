package com.example.project.service;

import com.example.project.entity.Property;
import com.example.project.entity.PropertyEmbedding;
import com.example.project.repository.PropertyEmbeddingRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Generates and stores text embeddings via HuggingFace sentence-transformers.
 * Falls back to local TF-IDF term frequency hashing vectorizer if offline.
 */
@Service
public class EmbeddingService {

    private static final String HF_EMBED_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";
    private static final double FRAUD_THRESHOLD  = 0.92;

    private final PropertyEmbeddingRepository embeddingRepo;
    private final OkHttpClient                httpClient;
    private final ObjectMapper                objectMapper;

    public EmbeddingService(PropertyEmbeddingRepository embeddingRepo) {
        this.embeddingRepo = embeddingRepo;
        this.httpClient    = new OkHttpClient();
        this.objectMapper  = new ObjectMapper();
    }

    // ── Public API ────────────────────────────────────────────────────────

    /**
     * Called asynchronously from PropertyService after create/update.
     * Non-blocking — never throws.
     */
    @Async
    public void storeEmbeddingAsync(Property property) {
        try {
            String text = buildText(property);
            float[] embedding = generateEmbedding(text);
            if (embedding == null) return;

            String json = objectMapper.writeValueAsString(floatArrayToList(embedding));
            Optional<PropertyEmbedding> existing = embeddingRepo.findByPropertyId(property.getId());

            PropertyEmbedding pe = existing.orElseGet(() ->
                    PropertyEmbedding.builder().property(property).build());
            pe.setEmbeddingJson(json);
            pe.setUpdatedAt(LocalDateTime.now());
            embeddingRepo.save(pe);
        } catch (Exception e) {
            // Swallow — embedding failure must never affect the main flow
        }
    }

    /**
     * Returns the number of other properties with cosine similarity ≥ 0.92
     * from a *different* agent/owner — the core fraud detection signal.
     * Returns 0 if embeddings are unavailable.
     */
    public int countDuplicates(Property target) {
        try {
            Optional<PropertyEmbedding> targetEmbed = embeddingRepo.findByPropertyId(target.getId());
            if (targetEmbed.isEmpty()) return 0;

            float[] targetVec = parseEmbedding(targetEmbed.get().getEmbeddingJson());
            List<PropertyEmbedding> allEmbeds = embeddingRepo.findAll();

            Long targetAgentId = target.getAgent()  != null ? target.getAgent().getId()  : null;
            Long targetOwnerId = target.getOwner()  != null ? target.getOwner().getId()  : null;

            int count = 0;
            for (PropertyEmbedding other : allEmbeds) {
                if (Objects.equals(other.getProperty().getId(), target.getId())) continue;

                // Only flag if from a DIFFERENT agent/owner
                Long otherAgentId = other.getProperty().getAgent() != null
                        ? other.getProperty().getAgent().getId() : null;
                Long otherOwnerId = other.getProperty().getOwner() != null
                        ? other.getProperty().getOwner().getId() : null;

                boolean sameAgent = targetAgentId != null && targetAgentId.equals(otherAgentId);
                boolean sameOwner = targetOwnerId != null && targetOwnerId.equals(otherOwnerId);
                if (sameAgent || sameOwner) continue;

                float[] otherVec = parseEmbedding(other.getEmbeddingJson());
                double sim = cosineSimilarity(targetVec, otherVec);
                if (sim >= FRAUD_THRESHOLD) count++;
            }
            return count;
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Generate an embedding for free-text input.
     * Calls HuggingFace first, falls back to offline local term hashing if unavailable.
     */
    public float[] generateEmbedding(String text) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(
                new java.util.HashMap<String, Object>() {{
                    put("inputs", text);
                }}
            );
            RequestBody requestBody = RequestBody.create(jsonPayload, MediaType.parse("application/json"));
            Request request = new Request.Builder()
                    .url(HF_EMBED_URL)
                    .post(requestBody)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseString = response.body().string();
                    JsonNode root = objectMapper.readTree(responseString);
                    JsonNode embeddingNode = root;
                    if (root.isArray() && root.size() > 0 && root.get(0).isArray()) {
                        embeddingNode = root.get(0);
                    }
                    List<Float> floats = new ArrayList<>();
                    if (embeddingNode.isArray()) {
                        for (JsonNode n : embeddingNode) {
                            floats.add((float) n.asDouble());
                        }
                        return listToFloatArray(floats);
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return generateLocalEmbedding(text);
    }

    /** Local TF-IDF keyword hashing vectorizer fallback (384 dimensions) */
    private float[] generateLocalEmbedding(String text) {
        float[] vector = new float[384];
        if (text == null || text.isBlank()) return vector;
        String[] words = text.toLowerCase().split("\\W+");
        for (String w : words) {
            if (w.length() < 2) continue;
            int idx = Math.abs(w.hashCode()) % 384;
            vector[idx] += 1.0f;
        }
        // Normalize the vector
        double sumSq = 0;
        for (float val : vector) sumSq += val * val;
        if (sumSq > 0) {
            float norm = (float) Math.sqrt(sumSq);
            for (int i = 0; i < vector.length; i++) vector[i] /= norm;
        }
        return vector;
    }

    /** Get stored embedding for a property; returns null if not stored. */
    public float[] getStoredEmbedding(Long propertyId) {
        try {
            return embeddingRepo.findByPropertyId(propertyId)
                    .map(pe -> parseEmbedding(pe.getEmbeddingJson()))
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** Cosine similarity between two vectors. Returns 0 on error. */
    public double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length != b.length) return 0.0;
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot   += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String buildText(Property p) {
        StringBuilder sb = new StringBuilder();
        if (p.getTitle()       != null) sb.append(p.getTitle()).append(" ");
        if (p.getDescription() != null) sb.append(p.getDescription()).append(" ");
        if (p.getAmenities()   != null) sb.append(p.getAmenities()).append(" ");
        if (p.getCity()        != null) sb.append(p.getCity()).append(" ");
        if (p.getLocation()    != null) sb.append(p.getLocation());
        return sb.toString().trim();
    }

    private float[] parseEmbedding(String json) {
        try {
            List<Float> list = objectMapper.readValue(json, new TypeReference<List<Float>>() {});
            return listToFloatArray(list);
        } catch (Exception e) {
            return null;
        }
    }

    private float[] listToFloatArray(List<Float> list) {
        float[] arr = new float[list.size()];
        for (int i = 0; i < list.size(); i++) arr[i] = list.get(i);
        return arr;
    }

    private List<Float> floatArrayToList(float[] arr) {
        List<Float> list = new ArrayList<>(arr.length);
        for (float f : arr) list.add(f);
        return list;
    }
}
