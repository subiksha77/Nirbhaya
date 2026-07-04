package com.nirbhaya.womensafetysystem.controller;

import com.nirbhaya.womensafetysystem.entity.Incident;
import com.nirbhaya.womensafetysystem.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "*")
public class IncidentController {

    @Autowired
    private IncidentRepository incidentRepository;

    // Save a new incident
    @PostMapping
    public Incident saveIncident(@RequestBody Incident incident) {
        return incidentRepository.save(incident);
    }

    // Get all incidents
    @GetMapping
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    // Get incident by ID
    @GetMapping("/{id}")
    public Incident getIncidentById(@PathVariable Long id) {
        Optional<Incident> incident = incidentRepository.findById(id);
        return incident.orElse(null);
    }

    // Update incident
    @PutMapping("/{id}")
    public Incident updateIncident(@PathVariable Long id, @RequestBody Incident updatedIncident) {

        Optional<Incident> existingIncident = incidentRepository.findById(id);

        if (existingIncident.isPresent()) {

            Incident incident = existingIncident.get();

            incident.setVictimName(updatedIncident.getVictimName());
            incident.setAge(updatedIncident.getAge());
            incident.setLocation(updatedIncident.getLocation());
            incident.setIncidentDate(updatedIncident.getIncidentDate());
            incident.setIncidentTime(updatedIncident.getIncidentTime());
            incident.setStatus(updatedIncident.getStatus());

            return incidentRepository.save(incident);
        }

        return null;
    }

    // Delete incident
    @DeleteMapping("/{id}")
    public String deleteIncident(@PathVariable Long id) {

        if (incidentRepository.existsById(id)) {
            incidentRepository.deleteById(id);
            return "Incident deleted successfully.";
        }

        return "Incident not found.";
    }

    // Count total incidents
    @GetMapping("/count")
    public long getIncidentCount() {
        return incidentRepository.count();
    }
}