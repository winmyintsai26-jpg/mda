namespace MDA.API.Authentication.Models;

public sealed class EmailVerificationToken : IUserOwnedEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public User User { get; set; } = null!;

    public bool IsUsable(DateTimeOffset now) => UsedAt is null && ExpiresAt > now;
}
