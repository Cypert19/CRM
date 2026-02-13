"use client";

import { KPITile } from "./kpi-tile";
import { ChartTile } from "./chart-tile";
import { TableTile } from "./table-tile";
import type { DashboardTile } from "@/types/dashboard";

type Props = {
  tile: DashboardTile;
};

export function TileRenderer({ tile }: Props) {
  switch (tile.tile_type) {
    case "kpi":
      return <KPITile tile={tile} />;
    case "chart":
      return <ChartTile tile={tile} />;
    case "table":
      return <TableTile tile={tile} />;
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
          Unknown tile type
        </div>
      );
  }
}
