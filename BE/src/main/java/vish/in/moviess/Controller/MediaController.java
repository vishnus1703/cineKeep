package vish.in.moviess.Controller;

import vish.in.moviess.Models.User;
import vish.in.moviess.Service.Userservice;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*")
public class MediaController {

    @Autowired
    private Userservice userservice;

    private String extractUsername(String header) {
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            return Jwts.parserBuilder()
                    .setSigningKey("yourSuperSecretSecureMutiCharacterKeyForCineKeepMovieApplication2026".getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        }
        return null;
    }

    @GetMapping("/user-data")
    public ResponseEntity<?> fetchUserData(@RequestHeader("Authorization") String authHeader) {
        try {
            String username = extractUsername(authHeader);
            if (username == null) return ResponseEntity.status(401).body("Invalid Token Signature");
            User user = userservice.getUserData(username);
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "favorites", user.getFavorites(),
                    "watchlist", user.getWatchlist()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/favorite")
    public ResponseEntity<?> toggleFavorite(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> body) {
        try {
            String username = extractUsername(authHeader);
            String movieId = body.get("movieId");
            return ResponseEntity.ok(userservice.toggleFavorite(username, movieId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/watchlist")
    public ResponseEntity<?> toggleWatchlist(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> body) {
        try {
            String username = extractUsername(authHeader);
            String movieId = body.get("movieId");
            return ResponseEntity.ok(userservice.toggleWatchlist(username, movieId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}