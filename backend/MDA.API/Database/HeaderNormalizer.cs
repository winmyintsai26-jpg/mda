using System.Text;

namespace MDA.API.Database;

public static class HeaderNormalizer
{
    public static string Normalize(string? header)
    {
        if (string.IsNullOrWhiteSpace(header))
        {
            return string.Empty;
        }

        // Smart matching rule: keep only letters/digits and force uppercase.
        // This removes spaces, punctuation, and symbols so "Ship Qty(LB)" and
        // "ShipQtyLB" normalize to the same key.
        var builder = new StringBuilder(header.Length);
        foreach (var character in header)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(char.ToUpperInvariant(character));
            }
        }

        return builder.ToString();
    }
}