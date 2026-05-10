package com.example.demo.controller;

import com.example.demo.model.HealthRecord;
import com.example.demo.repository.HealthRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = "*")
public class HealthRecordController {

    @Autowired
    private HealthRecordRepository recordRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<HealthRecord>> getPatientRecords(@PathVariable Long patientId) {
        return ResponseEntity.ok(recordRepository.findByPatientId(patientId));
    }

    @PostMapping("/")
    public ResponseEntity<HealthRecord> uploadRecord(@RequestBody HealthRecord record) {
        return ResponseEntity.ok(recordRepository.save(record));
    }
}
