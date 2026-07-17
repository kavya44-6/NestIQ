package com.example.project.repository;

import com.example.project.entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    // Customer: their own inquiries
    // JOIN FETCH ensures customer + property are loaded in a single SQL
    // query — prevents lazy-load proxy issues in service layer.
    @Query("SELECT i FROM Inquiry i " +
           "JOIN FETCH i.customer " +
           "JOIN FETCH i.property " +
           "WHERE i.customer.id = :customerId " +
           "ORDER BY i.createdAt DESC")
    List<Inquiry> findByCustomerIdOrderByCreatedAtDesc(@Param("customerId") Long customerId);

    // Agent: inquiries for their properties.
    // The JOIN FETCH here is the CRITICAL fix for the "agent name shows
    // instead of customer name" bug. Without it, Hibernate's first-level
    // cache can return the agent's own User object as the 'customer'
    // association because the agent User was the last entity loaded in
    // this JPA session context. JOIN FETCH forces a fresh JOIN that
    // populates i.customer with the actual customer row.
    @Query("SELECT i FROM Inquiry i " +
           "JOIN FETCH i.customer " +
           "JOIN FETCH i.property " +
           "WHERE i.property.agent.id = :agentId " +
           "ORDER BY i.createdAt DESC")
    List<Inquiry> findByPropertyAgentId(@Param("agentId") Long agentId);

    // Owner: inquiries on properties they own
    @Query("SELECT i FROM Inquiry i " +
           "JOIN FETCH i.customer " +
           "JOIN FETCH i.property " +
           "WHERE i.property.owner.id = :ownerId " +
           "ORDER BY i.createdAt DESC")
    List<Inquiry> findByPropertyOwnerId(@Param("ownerId") Long ownerId);

    // Count for owner dashboard
    @Query("SELECT COUNT(i) FROM Inquiry i WHERE i.property.owner.id = :ownerId")
    long countByPropertyOwnerId(@Param("ownerId") Long ownerId);
}
