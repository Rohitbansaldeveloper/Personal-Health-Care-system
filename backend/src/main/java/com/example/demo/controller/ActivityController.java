package com.example.demo.controller;

import com.example.demo.model.DailyActivity;
import com.example.demo.repository.DailyActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin(origins = "*")
public class ActivityController {

    @Autowired
    private DailyActivityRepository activityRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<DailyActivity>> getActivities(@PathVariable Long patientId) {
        return ResponseEntity.ok(activityRepository.findByPatientIdOrderByActivityDateAsc(patientId));
    }

    @PostMapping("/")
    public ResponseEntity<DailyActivity> logActivity(@RequestBody DailyActivity activity) {
        return ResponseEntity.ok(activityRepository.save(activity));
    }
}
