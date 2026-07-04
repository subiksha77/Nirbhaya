package com.nirbhaya.womensafetysystem.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nirbhaya.womensafetysystem.entity.User;
import com.nirbhaya.womensafetysystem.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    // TEST
    @GetMapping("/test")
    public String test() {
        return "User Controller Working!";
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        return ResponseEntity.ok(userService.registerUser(user));
    }

    // LOGIN (EMAIL + PASSWORD ONLY)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {

        User dbUser = userService.getUserByEmail(user.getEmail());

        if (dbUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found. Please register.");
        }

        if (!dbUser.getPassword().equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid password");
        }

        return ResponseEntity.ok(dbUser);
    }

    // GET ALL USERS
    @GetMapping
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        User user = userService.getUserById(id);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        return ResponseEntity.ok(user);
    }

    // GET BY EMAIL
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getByEmail(@PathVariable String email) {

        User user = userService.getUserByEmail(email);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        return ResponseEntity.ok(user);
    }

    // UPDATE USER
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody User user) {

        User dbUser = userService.getUserById(id);

        if (dbUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        dbUser.setFullName(user.getFullName());
        dbUser.setEmail(user.getEmail());
        dbUser.setPhone(user.getPhone());
        dbUser.setDob(user.getDob());
        dbUser.setAge(user.getAge());
        dbUser.setLocation(user.getLocation());
        dbUser.setAddress(user.getAddress());

        dbUser.setContact1Name(user.getContact1Name());
        dbUser.setContact1Phone(user.getContact1Phone());

        dbUser.setContact2Name(user.getContact2Name());
        dbUser.setContact2Phone(user.getContact2Phone());

        dbUser.setContact3Name(user.getContact3Name());
        dbUser.setContact3Phone(user.getContact3Phone());
        
        if (dbUser.getPassword() == null || !dbUser.getPassword().equals(user.getPassword())) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body("Invalid password");
}
        return ResponseEntity.ok(userService.registerUser(dbUser));
    }

    // DELETE USER
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    
}