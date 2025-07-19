# -*- coding: utf-8 -*-
import pandas as pd
import uuid

# Cargar datos
tabla1 = pd.read_csv("tabla1_limpia.csv")
tabla2 = pd.read_csv("tabla2_limpia.csv")

# Definir correspondencia de columnas de acciones con los nombres lógicos de la columna 0 de tabla2
acciones_map = {
    "Gra": "Acciones Grandes",
    "Med": "Acciones Medianas",
    "Peq": "Acciones Pequeñas",
    "Sup": "Acciones Super",
    "BN": "Bono Navideño",
    # Si tienes Min, mapea a Pequeñas o según corresponda
    "Min": "Acciones Pequeñas"
}

# Crear diccionario de stocks con UUIDs fijos usando la columna 0 (nombre lógico)
stock_types = {}
stock_sql = []
for idx, row in tabla2.iterrows():
    tipo = str(row[0]).strip()
    if tipo in ["Valor anterior", "T", "0", ""]:
        continue
    stock_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, tipo))
    stock_types[tipo] = stock_id
    value = float(row[5]) if not pd.isna(row[5]) else 0
    monthly_contribution = float(row[4]) if not pd.isna(row[4]) else 0
    stock_sql.append(
        f"insert into public.stocks (id, type, value, monthly_contribution, is_guaranteed, behavior) values ('{stock_id}', '{tipo}', {value}, {monthly_contribution}, false, 'CAPITAL_APPRECIATION');"
    )

# Crear miembros con UUIDs fijos
members_sql = []
member_ids = {}
for idx, row in tabla1.iterrows():
    name = str(row["NOMBRE DEL SOCIO "]).strip()
    if name == "NAN" or name == "" or name == "0":
        continue
    member_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, name))
    member_ids[name] = member_id
    members_sql.append(
        f"insert into public.members (id, name) values ('{member_id}', '{name}');"
    )

# Crear subscripciones de acciones
subs_sql = []
subscripciones = []  # Para manejo en préstamos tipo acción
for idx, row in tabla1.iterrows():
    name = str(row["NOMBRE DEL SOCIO "]).strip()
    if name == "NAN" or name == "" or name == "0":
        continue
    member_id = member_ids[name]
    for col, tipo_accion in acciones_map.items():
        cantidad = row.get(col, 0)
        if pd.isna(cantidad) or float(cantidad) == 0:
            continue
        stock_id = stock_types.get(tipo_accion)
        if not stock_id:
            continue
        sub_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{name}-{tipo_accion}"))
        subs_sql.append(
            f"insert into public.stock_subscriptions (id, member_id, stock_id, quantity, status) values ('{sub_id}', '{member_id}', '{stock_id}', {int(cantidad)}, 'active');"
        )
        subscripciones.append({
            'id': sub_id,
            'member_id': member_id,
            'member_name': name,
            'stock_id': stock_id,
            'stock_type': tipo_accion,
            'quantity': int(cantidad),
            'status': 'active',
            'financing_loan_id': None
        })

# Crear la reunión fija para todos los préstamos
meeting_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, 'reunion-prestamos-2025-07-15'))
meeting_sql = [
    f"insert into public.meetings (id, date, status) values ('{meeting_id}', '2025-07-15', 'active');"
]

# Crear préstamos por socio y operaciones/asientos

def crear_prestamo_sql(row, member_id, loan_type, cuota_col, interes_col, tasa, member_name):
    cuota = row.get(cuota_col, 0)
    interes = row.get(interes_col, 0)
    
    # Si no hay interés, no crear préstamo
    if pd.isna(interes) or float(interes) == 0:
        return None, None, None, None
    
    interes = float(interes)
    
    # Si hay interés pero no hay cuota (abono a capital), crear préstamo solo con interés
    if pd.isna(cuota) or float(cuota) == 0:
        # El socio solo está pagando interés, crear préstamo con saldo = interés / tasa
        saldo = interes / tasa
        cuota = interes  # La cuota será igual al interés
    else:
        # Hay tanto cuota como interés, calcular normalmente
        cuota = float(cuota)
        saldo = interes / tasa
    prestamo_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{member_id}-{loan_type}"))
    loan_sql = f"insert into public.loans (id, member_id, loan_type, approved_amount, disbursed_amount, outstanding_balance, monthly_payment_amount, interest_rate, status) values ('{prestamo_id}', '{member_id}', '{loan_type}', {saldo:.2f}, {saldo:.2f}, {saldo:.2f}, {cuota:.2f}, {tasa:.4f}, 'active');"
    # Operación de desembolso (sin amount)
    operation_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{prestamo_id}-operation"))
    operation_sql = f"insert into public.operations (id, meeting_id, member_id, type, date) values ('{operation_id}', '{meeting_id}', '{member_id}', 'LOAN_DISBURSEMENT', '2025-07-15');"
    # Asientos contables (usar account_type, y campos correctos)
    entry_id1 = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{operation_id}-debit"))
    entry_id2 = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{operation_id}-credit"))
    ledger_sql = [
        f"insert into public.ledger_entries (id, operation_id, account_type, amount, description) values ('{entry_id1}', '{operation_id}', 'CASH', {saldo:.2f}, 'DEBIT');",
        f"insert into public.ledger_entries (id, operation_id, account_type, amount, description) values ('{entry_id2}', '{operation_id}', 'LOANS_RECEIVABLE', {saldo:.2f}, 'CREDIT');"
    ]
    # Si es préstamo tipo acción, manejar subscripción
    subs_mod_sql = []
    if loan_type == 'accion':
        # Buscar subscripciones activas del socio
        subs_activas = [s for s in subscripciones if s['member_id'] == member_id and s['status'] == 'active']
        if not subs_activas:
            print(f"[ADVERTENCIA] El socio {member_name} no tiene subscripciones activas para asociar el préstamo de acción.")
        else:
            print(f"\nSocio: {member_name} - Préstamo tipo acción")
            print("Subscripciones activas:")
            for i, sub in enumerate(subs_activas):
                print(f"  [{i}] {sub['stock_type']} - Cantidad: {sub['quantity']}")
            while True:
                try:
                    idx = int(input("Selecciona el número de la subscripción a asociar: "))
                    if 0 <= idx < len(subs_activas):
                        break
                    else:
                        print("Índice fuera de rango.")
                except ValueError:
                    print("Por favor, ingresa un número válido.")
            sub_sel = subs_activas[idx]
            max_qty = sub_sel['quantity']
            while True:
                try:
                    qty = int(input(f"¿Cuántas acciones quieres asociar al préstamo? (1-{max_qty}): "))
                    if 1 <= qty <= max_qty:
                        break
                    else:
                        print("Cantidad fuera de rango.")
                except ValueError:
                    print("Por favor, ingresa un número válido.")
            # Crear nueva subscripción asociada al préstamo
            new_sub_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{member_id}-{sub_sel['stock_type']}-prestamo-{prestamo_id}"))
            subs_mod_sql.append(
                f"insert into public.stock_subscriptions (id, member_id, stock_id, quantity, status, financing_loan_id) values ('{new_sub_id}', '{member_id}', '{sub_sel['stock_id']}', {qty}, 'active', '{prestamo_id}');"
            )
            # Actualizar subscripción original
            nueva_cantidad = sub_sel['quantity'] - qty
            if nueva_cantidad == 0:
                subs_mod_sql.append(
                    f"delete from public.stock_subscriptions where id = '{sub_sel['id']}';"
                )
                sub_sel['quantity'] = 0
                sub_sel['status'] = 'deleted'
            else:
                subs_mod_sql.append(
                    f"update public.stock_subscriptions set quantity = {nueva_cantidad} where id = '{sub_sel['id']}';"
                )
                sub_sel['quantity'] = nueva_cantidad
    return loan_sql, operation_sql, ledger_sql, subs_mod_sql

loans_sql = []
operations_sql = []
ledger_sql = []
subs_mod_sql = []
for idx, row in tabla1.iterrows():
    name = str(row["NOMBRE DEL SOCIO "]).strip()
    if name == "NAN" or name == "" or name == "0":
        continue
    member_id = member_ids[name]
    # Corriente
    loan, op, ledger, subs_mod = crear_prestamo_sql(row, member_id, 'corriente', 'Cuota Corriente', 'Interes Corriente', 0.015, name)
    if loan:
        loans_sql.append(loan)
        operations_sql.append(op)
        ledger_sql.extend(ledger)
        if subs_mod:
            subs_mod_sql.extend(subs_mod)
    # Agil
    loan, op, ledger, subs_mod = crear_prestamo_sql(row, member_id, 'agil', 'Cuota Agil', 'Interez Agil', 0.02, name)
    if loan:
        loans_sql.append(loan)
        operations_sql.append(op)
        ledger_sql.extend(ledger)
        if subs_mod:
            subs_mod_sql.extend(subs_mod)
    # Prioritario
    if 'Cuota Prioritario' in row and 'Interes Prioritario' in row:
        loan, op, ledger, subs_mod = crear_prestamo_sql(row, member_id, 'prioritario', 'Cuota Prioritario', 'Interes Prioritario', 0.02, name)
        if loan:
            loans_sql.append(loan)
            operations_sql.append(op)
            ledger_sql.extend(ledger)
            if subs_mod:
                subs_mod_sql.extend(subs_mod)
    # Accion
    loan, op, ledger, subs_mod = crear_prestamo_sql(row, member_id, 'accion', 'Abono Accion', 'Interes Accion', 0.015, name)
    if loan:
        loans_sql.append(loan)
        operations_sql.append(op)
        ledger_sql.extend(ledger)
        if subs_mod:
            subs_mod_sql.extend(subs_mod)

# Guardar el SQL en un archivo
with open("seed_poblacion.sql", "w") as f:
    f.write("-- Poblar stocks\n")
    for line in stock_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar miembros\n")
    for line in members_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar subscripciones de acciones\n")
    for line in subs_sql:
        f.write(line + "\n")
    f.write("\n-- Crear reunión para préstamos\n")
    for line in meeting_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar prestamos\n")
    for line in loans_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar operaciones de desembolso\n")
    for line in operations_sql:
        f.write(line + "\n")
    f.write("\n-- Poblar asientos contables\n")
    for line in ledger_sql:
        f.write(line + "\n")
    f.write("\n-- Modificaciones de subscripciones por préstamos tipo acción\n")
    for line in subs_mod_sql:
        f.write(line + "\n")

print("Archivo seed_poblacion.sql generado correctamente.") 