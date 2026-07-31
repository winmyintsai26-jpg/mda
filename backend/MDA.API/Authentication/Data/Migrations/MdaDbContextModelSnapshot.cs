using MDA.API.Authentication.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace MDA.API.Authentication.Data.Migrations;

[DbContext(typeof(MdaDbContext))]
public sealed class MdaDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.ToTable("Users");
            user.HasKey(item => item.Id);
            user.Property(item => item.Email).HasMaxLength(254).IsRequired();
            user.Property(item => item.NormalizedEmail).HasMaxLength(254).IsRequired();
            user.Property(item => item.DisplayName).HasMaxLength(100).IsRequired();
            user.Property(item => item.PasswordHash).IsRequired();
            user.HasIndex(item => item.NormalizedEmail).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(refreshToken =>
        {
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
        });

        modelBuilder.Entity<EmailVerificationToken>(token =>
        {
            token.ToTable("EmailVerificationTokens");
            token.HasKey(item => item.Id);
            token.Property(item => item.TokenHash).HasColumnName("Token").HasMaxLength(64).IsRequired();
            token.Property(item => item.UsedAt).IsConcurrencyToken();
            token.HasIndex(item => item.TokenHash).IsUnique();
            token.HasIndex(item => new { item.UserId, item.ExpiresAt });
            token.HasOne(item => item.User)
                .WithMany(item => item.EmailVerificationTokens)
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
