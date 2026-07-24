import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PropertiesService } from "./properties.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { QueryPropertiesDto } from "./dto/query-properties.dto";
import { PresignPhotoDto } from "./dto/presign-photo.dto";
import { ConfirmPhotoDto } from "./dto/confirm-photo.dto";
import { UpsertPaymentAccountDto } from "./dto/upsert-payment-account.dto";
import { UnitsService } from "../units/units.service";
import { CreateUnitDto } from "../units/dto/create-unit.dto";
import { QueryUnitsDto } from "../units/dto/query-units.dto";
import { BulkGenerateUnitsAutoDto } from "../units/dto/bulk-generate-units-auto.dto";
import { BulkGenerateUnitsManualDto } from "../units/dto/bulk-generate-units-manual.dto";

// Landlord: full CRUD on own properties. Caretaker: read + units/tenants/maintenance/
// inspections on properties they're assigned to — never property CRUD or payment
// settings (10-implementation-notes.md). Admin: platform-wide oversight (not built
// here — see Admin Portal milestone).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller("properties")
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly unitsService: UnitsService,
  ) {}

  @Roles(UserRole.LANDLORD)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPropertiesDto) {
    return this.propertiesService.findAll(user, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.propertiesService.findOne(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(user.id, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.propertiesService.remove(user.id, id);
  }

  @Roles(UserRole.LANDLORD)
  @Post(":id/photos/presign")
  presignPhoto(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: PresignPhotoDto) {
    return this.propertiesService.presignPhoto(user.id, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post(":id/photos")
  confirmPhoto(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ConfirmPhotoDto) {
    return this.propertiesService.confirmPhoto(user.id, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Delete(":id/photos/:photoId")
  deletePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("photoId") photoId: string,
  ) {
    return this.propertiesService.deletePhoto(user.id, id, photoId);
  }

  @Roles(UserRole.LANDLORD)
  @Put(":id/payment-account")
  upsertPaymentAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpsertPaymentAccountDto,
  ) {
    return this.propertiesService.upsertPaymentAccount(user.id, id, dto);
  }

  @Get(":id/units")
  findUnits(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query() query: QueryUnitsDto) {
    return this.unitsService.findAllForProperty(user, id, query);
  }

  @Post(":id/units")
  createUnit(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateUnitDto) {
    return this.unitsService.create(user, id, dto);
  }

  @Post(":id/units/bulk-auto")
  bulkGenerateAuto(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: BulkGenerateUnitsAutoDto,
  ) {
    return this.unitsService.bulkGenerateAuto(user, id, dto);
  }

  @Post(":id/units/bulk-manual")
  bulkGenerateManual(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: BulkGenerateUnitsManualDto,
  ) {
    return this.unitsService.bulkGenerateManual(user, id, dto);
  }
}
