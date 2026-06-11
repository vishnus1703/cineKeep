package vish.in.moviess.Models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username cannot be empty")
    @Column(unique = true, nullable = false)
    private String username;

    @NotBlank(message = "Password cannot be empty")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Invalid email format")
    @Column(unique = true, nullable = false)
    private String email;

    // Creates user_favorites relational table automatically
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_favorites", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "movie_id")
    private Set<String> favorites = new HashSet<>();

    // Creates user_watchlist relational table automatically
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_watchlist", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "movie_id")
    private Set<String> watchlist = new HashSet<>();

    public User() {}

    public User(String username, String password, String email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Set<String> getFavorites() { return favorites; }
    public void setFavorites(Set<String> favorites) { this.favorites = favorites; }
    public Set<String> getWatchlist() { return watchlist; }
    public void setWatchlist(Set<String> watchlist) { this.watchlist = watchlist; }
}