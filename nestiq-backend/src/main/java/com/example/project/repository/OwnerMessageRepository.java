package com.example.project.repository;

import com.example.project.entity.OwnerMessage;
import com.example.project.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OwnerMessageRepository extends JpaRepository<OwnerMessage, Long> {

    @Query("SELECT m FROM OwnerMessage m " +
           "JOIN FETCH m.property p " +
           "WHERE p.owner.id = :ownerId " +
           "ORDER BY m.createdAt DESC")
    List<OwnerMessage> findByPropertyOwnerId(@Param("ownerId") Long ownerId);

    List<OwnerMessage> findByAgent(User agent);

    @Query("SELECT m FROM OwnerMessage m WHERE m.agent.id = :agentId ORDER BY m.createdAt DESC")
    List<OwnerMessage> findByAgentIdOrderByCreatedAtDesc(@Param("agentId") Long agentId);

    @Query("SELECT COUNT(m) FROM OwnerMessage m WHERE m.property.owner.id = :ownerId AND m.status = 'PENDING'")
    long countPendingByOwnerId(@Param("ownerId") Long ownerId);
}
