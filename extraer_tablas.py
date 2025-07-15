import pandas as pd
import numpy as np

archivo = "FONDO_FAMILIAR_v3-1.xlsx"
hoja = "05-25"

# Leer la fila 3 como cabecera (índice 2), columnas B:X
cabeceras = pd.read_excel(archivo, sheet_name=hoja, header=None, usecols="B:X", skiprows=2, nrows=1)
columnas = [str(cabeceras.iloc[0, i]) for i in range(cabeceras.shape[1])]
# Leer los datos desde la fila 4 (índice 3), columnas B:X
tabla1 = pd.read_excel(archivo, sheet_name=hoja, header=None, usecols="B:X", skiprows=3, nrows=21)
tabla1.columns = columnas

def limpiar_tabla(tabla):
    # Eliminar columnas completamente vacías
    tabla = tabla.dropna(axis=1, how='all')
    # Reemplazar celdas vacías por 0
    tabla = tabla.replace({np.nan: 0})
    return tabla

tabla1_limpia = limpiar_tabla(tabla1)

# Segunda tabla igual que antes
tabla2 = pd.read_excel(archivo, sheet_name=hoja, header=None, usecols="C:N", skiprows=41, nrows=8)
tabla2_limpia = limpiar_tabla(tabla2)

# Guardar como CSV
tabla1_limpia.to_csv("tabla1_limpia.csv", index=False)
tabla2_limpia.to_csv("tabla2_limpia.csv", index=False)

# Mostrar como Markdown (con separación clara)
print("### Primera tabla (B-X, filas 4-24):\n")
print(tabla1_limpia.to_markdown(index=False, tablefmt="github"))
print("\n---\n")
print("### Segunda tabla (C-N, filas 42-49):\n")
print(tabla2_limpia.to_markdown(index=False, tablefmt="github"))
print("\nArchivos 'tabla1_limpia.csv' y 'tabla2_limpia.csv' generados correctamente.") 