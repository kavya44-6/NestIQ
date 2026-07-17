package com.example.project.repository;

import com.example.project.entity.PropertyEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PropertyEmbeddingRepository extends JpaRepository<PropertyEmbedding, Long> {

    Optional<PropertyEmbedding> findByPropertyId(Long propertyId);
}
