import { Module } from '@nestjs/common';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementService } from './stock-movement.service';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockReportController } from './stock-report.controller';
import { StockReportService } from './stock-report.service';
import { StockAlertController } from './stock-alert.controller';
import { StockAlertService } from './stock-alert.service';

@Module({
  controllers: [
    SupplierController, PurchaseController,
    StockMovementController, TransferController, InventoryController,
    StockReportController, StockAlertController,
  ],
  providers: [
    SupplierService, PurchaseService,
    StockMovementService, TransferService, InventoryService,
    StockReportService, StockAlertService,
  ],
  exports: [
    SupplierService, PurchaseService,
    StockMovementService, TransferService, InventoryService,
    StockReportService, StockAlertService,
  ],
})
export class StockModule {}
