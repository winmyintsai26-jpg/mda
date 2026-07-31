using MDA.API.Authentication.Data;
using MDA.API.Authentication.Models;
using Microsoft.EntityFrameworkCore;

namespace MDA.API.Authentication.Repositories;

public sealed class UserRepository(MdaDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users.SingleOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<RefreshToken?> GetRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken) =>
        dbContext.RefreshTokens.Include(token => token.User)
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

    public Task<EmailVerificationToken?> GetEmailVerificationTokenAsync(string tokenHash, CancellationToken cancellationToken) =>
        dbContext.EmailVerificationTokens.Include(token => token.User)
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);

    public Task<List<EmailVerificationToken>> GetUsableEmailVerificationTokensAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken) =>
        dbContext.EmailVerificationTokens
            .Where(token => token.UserId == userId && token.UsedAt == null && token.ExpiresAt > now)
            .ToListAsync(cancellationToken);

    public async Task AddUserAsync(User user, CancellationToken cancellationToken) =>
        await dbContext.Users.AddAsync(user, cancellationToken);

    public async Task AddRefreshTokenAsync(RefreshToken refreshToken, CancellationToken cancellationToken) =>
        await dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken);

    public async Task AddEmailVerificationTokenAsync(EmailVerificationToken token, CancellationToken cancellationToken) =>
        await dbContext.EmailVerificationTokens.AddAsync(token, cancellationToken);

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken);
}
