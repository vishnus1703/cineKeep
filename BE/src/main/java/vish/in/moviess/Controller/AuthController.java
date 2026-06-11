package vish.in.moviess.Controller;

import vish.in.moviess.Models.User;
import vish.in.moviess.Models.LoginRequest;
import vish.in.moviess.Models.AuthResponse;
import vish.in.moviess.Service.Userservice;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private Userservice userservice;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {
            String token = userservice.registerUser(user);
            return ResponseEntity.ok(new AuthResponse(token, user.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            String token = userservice.authenticateUser(loginRequest.username(), loginRequest.password());
            return ResponseEntity.ok(new AuthResponse(token, loginRequest.username()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}