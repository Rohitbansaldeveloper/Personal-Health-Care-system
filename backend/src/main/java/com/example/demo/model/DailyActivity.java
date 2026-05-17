package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "daily_activities")
public class DailyActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private LocalDate activityDate;

    private Integer steps;

    private Double exerciseHours;

    private Integer waterGlasses;

    // Samsung Galaxy Watch health metrics
    private Integer heartRate;

    private Integer bloodPressureSystolic;

    private Integer bloodPressureDiastolic;

    private Double sleepHours;

    private Integer stressLevel; // Scale of 1 to 100

    private Integer spo2; // Blood oxygen percentage (e.g. 95-100)
}
