import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CaretakersService } from "./caretakers.service";

// Landlord: invite/manage caretakers.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("caretakers")
export class CaretakersController {
  constructor(private readonly caretakersService: CaretakersService) {}
}
