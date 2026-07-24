import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import type { SignOptions } from "jsonwebtoken";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { EmailService } from "./email.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { ClerkStrategy } from "./strategies/clerk.strategy";
import { ClerkIdentityStrategy } from "./strategies/clerk-identity.strategy";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    PassportModule,
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN", "1d") as SignOptions["expiresIn"],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtStrategy, ClerkStrategy, ClerkIdentityStrategy],
  exports: [AuthService, EmailService],
})
export class AuthModule {}
