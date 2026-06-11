package vish.in.moviess.Service;

import vish.in.moviess.Models.User;
import vish.in.moviess.Repository.UserRepository;
import vish.in.moviess.Utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Set;

@Service
public class Userservice {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String registerUser(User user) throws Exception {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new Exception("Username is already taken!");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new Exception("Email is already in use!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return jwtUtil.generateToken(user.getUsername());
    }

    public String authenticateUser(String username, String password) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("User not found!"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid credentials!");
        }

        return jwtUtil.generateToken(user.getUsername());
    }

    // NEW: Fetch complete user data package for sync updates
    public User getUserData(String username) throws Exception {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("User record missing"));
    }

    // NEW: Toggle Favorite state tracking
    public Set<String> toggleFavorite(String username, String movieId) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("User profile missing"));

        if (user.getFavorites().contains(movieId)) {
            user.getFavorites().remove(movieId);
        } else {
            user.getFavorites().add(movieId);
        }
        userRepository.save(user);
        return user.getFavorites();
    }

    // NEW: Toggle Watchlist bookmark state tracking
    public Set<String> toggleWatchlist(String username, String movieId) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("User profile missing"));

        if (user.getWatchlist().contains(movieId)) {
            user.getWatchlist().remove(movieId);
        } else {
            user.getWatchlist().add(movieId);
        }
        userRepository.save(user);
        return user.getWatchlist();
    }
}