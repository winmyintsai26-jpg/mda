using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace MDA.API.Authentication.Data.Migrations;

[DbContext(typeof(MdaDbContext))]
[Migration("202607310002_EmailVerification")]
public sealed class EmailVerification : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "EmailVerificationTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                Token = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                UsedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EmailVerificationTokens", item => item.Id);
                table.ForeignKey(
                    name: "FK_EmailVerificationTokens_Users_UserId",
                    column: item => item.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_EmailVerificationTokens_Token",
            table: "EmailVerificationTokens",
            column: "Token",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_EmailVerificationTokens_UserId_ExpiresAt",
            table: "EmailVerificationTokens",
            columns: new[] { "UserId", "ExpiresAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "EmailVerificationTokens");
}
