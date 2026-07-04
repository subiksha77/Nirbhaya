package com.nirbhaya.womensafetysystem.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.nirbhaya.womensafetysystem.entity.Incident;
import com.nirbhaya.womensafetysystem.repository.IncidentRepository;

@Service
public class IncidentService {

    @Autowired
    private IncidentRepository repository;

    public List<Incident> getAllIncidents() {
        return repository.findAll();
    }

    public Incident getIncidentById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Incident saveIncident(Incident incident) {
        return repository.save(incident);
    }

    public Incident updateIncident(Long id, Incident incident) {

        Incident existing = repository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setVictimName(incident.getVictimName());
        existing.setAge(incident.getAge());
        existing.setLocation(incident.getLocation());
        existing.setIncidentDate(incident.getIncidentDate());
        existing.setIncidentTime(incident.getIncidentTime());
        existing.setStatus(incident.getStatus());

        return repository.save(existing);
    }

    public void deleteIncident(Long id) {
        repository.deleteById(id);
    }
}
