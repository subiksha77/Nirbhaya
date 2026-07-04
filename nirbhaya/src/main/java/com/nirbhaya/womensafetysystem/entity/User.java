package com.nirbhaya.womensafetysystem.entity;

import jakarta.persistence.*;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    private String phone;

    // 🔥 ADD THIS LINE
    private String password;

    private String dob;
    private Integer age;
    private String location;
    private String address;

    private String contact1Name;
    private String contact1Phone;

    private String contact2Name;
    private String contact2Phone;

    private String contact3Name;
    private String contact3Phone;

    // ---------------- GETTERS & SETTERS ----------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    // 🔥 PASSWORD GETTER/SETTER (THIS FIXES YOUR ERROR)

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContact1Name() {
        return contact1Name;
    }

    public void setContact1Name(String contact1Name) {
        this.contact1Name = contact1Name;
    }

    public String getContact1Phone() {
        return contact1Phone;
    }

    public void setContact1Phone(String contact1Phone) {
        this.contact1Phone = contact1Phone;
    }

    public String getContact2Name() {
        return contact2Name;
    }

    public void setContact2Name(String contact2Name) {
        this.contact2Name = contact2Name;
    }

    public String getContact2Phone() {
        return contact2Phone;
    }

    public void setContact2Phone(String contact2Phone) {
        this.contact2Phone = contact2Phone;
    }

    public String getContact3Name() {
        return contact3Name;
    }

    public void setContact3Name(String contact3Name) {
        this.contact3Name = contact3Name;
    }

    public String getContact3Phone() {
        return contact3Phone;
    }

    public void setContact3Phone(String contact3Phone) {
        this.contact3Phone = contact3Phone;
    }
}