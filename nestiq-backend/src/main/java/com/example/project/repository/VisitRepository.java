package com.example.project.repository;

import com.example.project.entity.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface VisitRepository extends JpaRepository<Visit, Long> {

    @Query("SELECT v FROM Visit v " +
           "JOIN FETCH v.customer " +
           "JOIN FETCH v.property " +
           "WHERE v.customer.id = :customerId " +
           "ORDER BY v.createdAt DESC")
    List<Visit> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") Long customerId);

    // Same JOIN FETCH fix as InquiryRepository — ensures v.getCustomer()
    // always returns the booking customer's User, not the agent's User.
    @Query("SELECT v FROM Visit v " +
           "JOIN FETCH v.customer " +
           "JOIN FETCH v.property " +
           "WHERE v.property.agent.id = :agentId " +
           "ORDER BY v.createdAt DESC")
    List<Visit> findByPropertyAgentId(@Param("agentId") Long agentId);

    // Owner: visits on properties they own
    @Query("SELECT v FROM Visit v " +
           "JOIN FETCH v.customer " +
           "JOIN FETCH v.property " +
           "WHERE v.property.owner.id = :ownerId " +
           "ORDER BY v.createdAt DESC")
    List<Visit> findByPropertyOwnerId(@Param("ownerId") Long ownerId);

    // Count for owner dashboard
    @Query("SELECT COUNT(v) FROM Visit v WHERE v.property.owner.id = :ownerId")
    long countByPropertyOwnerId(@Param("ownerId") Long ownerId);
}
