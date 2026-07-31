namespace MDA.API.Authentication.Models;

public interface IUserOwnedEntity
{
    Guid UserId { get; set; }
}
