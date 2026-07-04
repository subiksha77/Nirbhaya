package com.nirbhaya.womensafetysystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nirbhaya.womensafetysystem.entity.Incident;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

}