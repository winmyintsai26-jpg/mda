using MDA.API.Authentication.Models;
using Microsoft.EntityFrameworkCore;

namespace MDA.API.Authentication.Data;

public sealed class MdaDbContext(DbContextOptions<MdaDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var user = modelBuilder.Entity<User>();
        user.ToTable("Users");
        user.HasKey(item => item.Id);
        user.Property(item => item.Email).HasMaxLength(254).IsRequired();
        user.Property(item => item.NormalizedEmail).HasMaxLength(254).IsRequired();
        user.Property(item => item.DisplayName).HasMaxLength(100).IsRequired();
        user.Property(item => item.PasswordHash).IsRequired();
        user.HasIndex(item => item.NormalizedEmail).IsUnique();

        var refreshToken = modelBuilder.Entity<RefreshToken>();
        refreshToken.ToTable("RefreshTokens");
        refreshToken.HasKey(item => item.Id);
        refreshToken.Property(item => item.TokenHash).HasColumnName("Token").HasMaxLength(64).IsRequired();
        refreshToken.Property(item => item.RevokedAt).IsConcurrencyToken();
        refreshToken.HasIndex(item => item.TokenHash).IsUnique();
        refreshToken.HasIndex(item => new { item.UserId, item.ExpiresAt });
        refreshToken.HasOne(item => item.User)
            .WithMany(item => item.RefreshTokens)
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        var emailVerificationToken = modelBuilder.Entity<EmailVerificationToken>();
        emailVerificationToken.ToTable("EmailVerificationTokens");
        emailVerificationToken.HasKey(item => item.Id);
        emailVerificationToken.Property(item => item.TokenHash).HasColumnName("Token").HasMaxLength(64).IsRequired();
        emailVerificationToken.Property(item => item.UsedAt).IsConcurrencyToken();
        emailVerificationToken.HasIndex(item => item.TokenHash).IsUnique();
        emailVerificationToken.HasIndex(item => new { item.UserId, item.ExpiresAt });
        emailVerificationToken.HasOne(item => item.User)
            .WithMany(item => item.EmailVerificationTokens)
            .HasForeignKey(item => item.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
