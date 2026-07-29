import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps, GridValidRowModel } from '@mui/x-data-grid';

interface DataTableProps<R extends GridValidRowModel> extends Omit<DataGridProps<R>, 'autoHeight'> {
  /** Hauteur du conteneur. Le DataGrid a besoin d'une hauteur explicite. */
  height?: number | string;
}

/**
 * Enrobage du DataGrid : hauteur, pagination et barre d'outils par défaut.
 *
 * La localisation française vient du thème (`gridFrFR`), pas d'un `localeText`
 * passé ici — ce qui laisse les pages libres de surcharger un libellé isolé.
 */
export function DataTable<R extends GridValidRowModel>({
  height = 520,
  pageSizeOptions = [10, 25, 50],
  initialState,
  showToolbar = true,
  ...rest
}: DataTableProps<R>) {
  return (
    <Box sx={{ width: '100%', height }}>
      <DataGrid<R>
        showToolbar={showToolbar}
        pageSizeOptions={pageSizeOptions}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
          ...initialState,
        }}
        sx={{
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
        }}
        {...rest}
      />
    </Box>
  );
}

export default DataTable;
