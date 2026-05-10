package com.example.demo.repository;

import com.example.demo.model.DailyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {
    List<DailyActivity> findByPatientIdOrderByActivityDateAsc(Long patientId);
}
