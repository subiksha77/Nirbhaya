package com.nirbhaya.womensafetysystem.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.nirbhaya.womensafetysystem.entity.User;
import com.nirbhaya.womensafetysystem.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Register User
    

   public User registerUser(User user) {

    User existing = userRepository.findByEmail(user.getEmail()).orElse(null);

    if (existing != null) {

        existing.setFullName(user.getFullName());
        existing.setPassword(user.getPassword()); // 🔥 FIX HERE
        existing.setPhone(user.getPhone());
        existing.setDob(user.getDob());
        existing.setAge(user.getAge());
        existing.setLocation(user.getLocation());
        existing.setAddress(user.getAddress());

        existing.setContact1Name(user.getContact1Name());
        existing.setContact1Phone(user.getContact1Phone());

        existing.setContact2Name(user.getContact2Name());
        existing.setContact2Phone(user.getContact2Phone());

        existing.setContact3Name(user.getContact3Name());
        existing.setContact3Phone(user.getContact3Phone());

        return userRepository.save(existing);  // 🔥 SAVE UPDATED USER
    }

    return userRepository.save(user);
}
    // Get All Users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get User By ID
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // Find User By Email
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    // Delete User
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}