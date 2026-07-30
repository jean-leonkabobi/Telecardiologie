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
          /**
           * Le contour n'est retiré qu'au clic, pas au clavier.
           *
           * La version précédente neutralisait `:focus` **et** `:focus-within`
           * sans condition : un utilisateur qui parcourait le tableau aux flèches
           * n'avait plus aucune idée de la cellule où il se trouvait. Or le
           * DataGrid est une grille navigable au clavier — c'est précisément là
           * que le repère compte.
           *
           * `:focus:not(:focus-visible)` cible le cas qui gênait : le contour
           * apparu après un clic de souris.
           */
          '& .MuiDataGrid-cell:focus:not(:focus-visible)': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus:not(:focus-visible)': { outline: 'none' },
          '& .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-columnHeader:focus-visible': {
            outline: (t) => `2px solid ${t.palette.primary.main}`,
            outlineOffset: -2,
          },
        }}
        {...rest}
      />
    </Box>
  );
}

export default DataTable;
