package com.example.project.service;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PythonAiClient {

    private static final Logger log = LoggerFactory.getLogger(PythonAiClient.class);
    private static final String AI_BASE_URL = "http://localhost:8000";
    private final RestTemplate restTemplate;

    public PythonAiClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000); // 2000ms connect timeout
        factory.setReadTimeout(5000);    // 5000ms read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> predictPrice(Map<String, Object> payload) {
        try {
            return restTemplate.postForObject(AI_BASE_URL + "/predict-price", payload, Map.class);
        } catch (Exception e) {
            log.warn("Python AI unavailable for predictPrice, using Java fallback: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> recommend(Map<String, Object> payload) {
        try {
            Map<String, Object> response = restTemplate.postForObject(AI_BASE_URL + "/recommend", payload, Map.class);
            if (response != null && "success".equals(response.get("status"))) {
                return (List<Map<String, Object>>) response.get("results");
            }
            return null;
        } catch (Exception e) {
            log.warn("Python AI unavailable for recommend, using Java fallback: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> verifyRera(Map<String, Object> payload) {
        try {
            return restTemplate.postForObject(AI_BASE_URL + "/verify-rera", payload, Map.class);
        } catch (Exception e) {
            log.warn("Python AI unavailable for verifyRera, using Java fallback: {}", e.getMessage());
            return null;
        }
    }

    public boolean isAiServiceUp() {
        try {
            Map<?, ?> response = restTemplate.getForObject(AI_BASE_URL + "/health", Map.class);
            return response != null && "ok".equals(response.get("status"));
        } catch (Exception e) {
            return false;
        }
    }
}
