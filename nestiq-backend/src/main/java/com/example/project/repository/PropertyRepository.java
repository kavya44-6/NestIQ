package com.example.project.repository;

import com.example.project.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long>,
        JpaSpecificationExecutor<Property> {

    // Public listing — approved=true only (kept for backward-compat with Specification fallback)
    List<Property> findByApprovedTrue();
    List<Property> findByCityAndApprovedTrue(String city);
    List<Property> findByListingTypeAndApprovedTrue(String listingType);
    List<Property> findByCityAndListingTypeAndApprovedTrue(String city, String listingType);

    // Agent's own listings (approved or not)
    List<Property> findByAgentId(Long agentId);

    // Owner's own listings
    List<Property> findByOwnerId(Long ownerId);

    // Admin: pending approval
    List<Property> findByApprovedFalse();

    // Count by agent — used for agentActivity trust component
    long countByAgentId(Long agentId);
    long countByAgentIdAndApprovedTrue(Long agentId);
    long countByAgentIdAndStatus(Long agentId, String status);

    // Fair-price comparison — finds approved listings in the same city + BHK
    List<Property> findByCityAndBhkAndApprovedTrue(String city, Integer bhk);
}
