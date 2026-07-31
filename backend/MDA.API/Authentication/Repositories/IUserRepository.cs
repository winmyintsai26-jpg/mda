using MDA.API.Authentication.Models;

namespace MDA.API.Authentication.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);

    Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<RefreshToken?> GetRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken);

    Task<EmailVerificationToken?> GetEmailVerificationTokenAsync(string tokenHash, CancellationToken cancellationToken);

    Task<List<EmailVerificationToken>> GetUsableEmailVerificationTokensAsync(Guid userId, DateTimeOffset now, CancellationToken cancellationToken);

    Task AddUserAsync(User user, CancellationToken cancellationToken);

    Task AddRefreshTokenAsync(RefreshToken refreshToken, CancellationToken cancellationToken);

    Task AddEmailVerificationTokenAsync(EmailVerificationToken token, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
