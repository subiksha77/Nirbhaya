package com.nirbhaya.womensafetysystem.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("")
    public String home() {
        return "Nirbhaya Home Page";
    }

    @GetMapping("/test")
    public String test() {
        return "Nirbhaya Application is running successfully!";
    }

    @GetMapping("/status")
    public String status() {
        return "Server is UP";
    }
}