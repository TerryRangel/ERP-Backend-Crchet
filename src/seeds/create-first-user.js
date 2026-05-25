import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'

const FIRST_USER = {


  nombre: 'Proyecto',
  apellido: 'Admin',
  email: 'proyecto@erp.local',
  usuario: 'proyecto',
  password: 'Hello2U',
  role: 'ADMIN',
  roleId: 'role_admin',
  activo: true,

  





  

}




const DEFAULT_PERMISSIONS = [
  { code: 'auth:me', nombre: 'Ver usuario autenticado', descripcion: 'Permite consultar el usuario autenticado', modulo: 'auth' },

  { code: 'users:read', nombre: 'Ver usuarios', descripcion: 'Permite listar y ver usuarios', modulo: 'users' },
  { code: 'users:create', nombre: 'Crear usuarios', descripcion: 'Permite crear usuarios', modulo: 'users' },
  { code: 'users:update', nombre: 'Editar usuarios', descripcion: 'Permite actualizar usuarios', modulo: 'users' },
  { code: 'users:delete', nombre: 'Eliminar usuarios', descripcion: 'Permite eliminar usuarios', modulo: 'users' },

  { code: 'roles:read', nombre: 'Ver roles', descripcion: 'Permite listar y ver roles', modulo: 'roles' },
  { code: 'roles:create', nombre: 'Crear roles', descripcion: 'Permite crear roles', modulo: 'roles' },
  { code: 'roles:update', nombre: 'Editar roles', descripcion: 'Permite actualizar roles', modulo: 'roles' },
  { code: 'roles:delete', nombre: 'Eliminar roles', descripcion: 'Permite eliminar roles', modulo: 'roles' },

  { code: 'permissions:read', nombre: 'Ver permisos', descripcion: 'Permite listar y ver permisos', modulo: 'permissions' },
  { code: 'permissions:create', nombre: 'Crear permisos', descripcion: 'Permite crear permisos', modulo: 'permissions' },
  { code: 'permissions:update', nombre: 'Editar permisos', descripcion: 'Permite actualizar permisos', modulo: 'permissions' },
  { code: 'permissions:delete', nombre: 'Eliminar permisos', descripcion: 'Permite eliminar permisos', modulo: 'permissions' },
  { code: 'permissions:seed', nombre: 'Sembrar permisos', descripcion: 'Permite sembrar permisos base', modulo: 'permissions' },

  { code: 'clients:read', nombre: 'Ver clientes', descripcion: 'Permite listar y ver clientes', modulo: 'clients' },
  { code: 'clients:create', nombre: 'Crear clientes', descripcion: 'Permite crear clientes', modulo: 'clients' },
  { code: 'clients:update', nombre: 'Editar clientes', descripcion: 'Permite actualizar clientes', modulo: 'clients' },
  { code: 'clients:delete', nombre: 'Eliminar clientes', descripcion: 'Permite eliminar clientes', modulo: 'clients' },

  { code: 'suppliers:read', nombre: 'Ver proveedores', descripcion: 'Permite listar y ver proveedores', modulo: 'suppliers' },
  { code: 'suppliers:create', nombre: 'Crear proveedores', descripcion: 'Permite crear proveedores', modulo: 'suppliers' },
  { code: 'suppliers:update', nombre: 'Editar proveedores', descripcion: 'Permite actualizar proveedores', modulo: 'suppliers' },
  { code: 'suppliers:delete', nombre: 'Eliminar proveedores', descripcion: 'Permite eliminar proveedores', modulo: 'suppliers' },

  { code: 'products:read', nombre: 'Ver productos', descripcion: 'Permite listar y ver productos', modulo: 'products' },
  { code: 'products:create', nombre: 'Crear productos', descripcion: 'Permite crear productos', modulo: 'products' },
  { code: 'products:update', nombre: 'Editar productos', descripcion: 'Permite actualizar productos', modulo: 'products' },
  { code: 'products:delete', nombre: 'Eliminar productos', descripcion: 'Permite eliminar productos', modulo: 'products' },

  { code: 'inventory:read', nombre: 'Ver inventario', descripcion: 'Permite consultar inventario', modulo: 'inventory' },
  { code: 'inventory:update', nombre: 'Actualizar inventario', descripcion: 'Permite ajustar inventario', modulo: 'inventory' },

  { code: 'recepciones:read', nombre: 'Ver recepciones', descripcion: 'Permite listar y ver recepciones', modulo: 'recepciones' },
  { code: 'recepciones:create', nombre: 'Crear recepciones', descripcion: 'Permite registrar recepciones', modulo: 'recepciones' },
  { code: 'recepciones:update', nombre: 'Editar recepciones', descripcion: 'Permite actualizar recepciones', modulo: 'recepciones' },
  { code: 'recepciones:delete', nombre: 'Eliminar recepciones', descripcion: 'Permite eliminar recepciones', modulo: 'recepciones' },

  { code: 'audit:read', nombre: 'Ver auditoría', descripcion: 'Permite consultar la auditoría', modulo: 'audit' },
  { code: 'dashboard:read', nombre: 'Ver dashboard', descripcion: 'Permite consultar el dashboard', modulo: 'dashboard' }
]

async function ensurePermissions() {
  const permissionsCollection = db.collection('permissions')
  const batch = db.batch()

  for (const permission of DEFAULT_PERMISSIONS) {
    const ref = permissionsCollection.doc(permission.code)

    batch.set(ref, {
      code: permission.code,
      nombre: permission.nombre,
      descripcion: permission.descripcion,
      modulo: permission.modulo,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true })
  }

  await batch.commit()

  const snapshot = await permissionsCollection.get()

  const permissionCodes = snapshot.docs.map((doc) => {
    const data = doc.data()
    return data.code || doc.id
  })

  return permissionCodes.sort()
}

async function ensureAdminRole(allPermissions) {
  const roleRef = db.collection('roles').doc(FIRST_USER.roleId)

  await roleRef.set({
    nombre: FIRST_USER.role,
    descripcion: 'Rol administrador con acceso total',
    permissions: allPermissions,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }, { merge: true })
}

async function findUserByUsuario(usuario) {
  const snapshot = await db
    .collection('users')
    .where('usuario', '==', usuario)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]

  return {
    id: doc.id,
    ...doc.data()
  }
}

async function createOrUpdateFirstUser(allPermissions) {
  const passwordHash = await bcrypt.hash(FIRST_USER.password, 10)
  const existingUser = await findUserByUsuario(FIRST_USER.usuario)

  const data = {
    nombre: FIRST_USER.nombre,
    apellido: FIRST_USER.apellido,
    email: FIRST_USER.email,
    usuario: FIRST_USER.usuario,
    passwordHash,
    role: FIRST_USER.role,
    roleId: FIRST_USER.roleId,
    permissions: allPermissions,
    activo: FIRST_USER.activo,
    updatedAt: new Date().toISOString()
  }

  if (existingUser) {
    await db.collection('users').doc(existingUser.id).set(data, { merge: true })

    return {
      id: existingUser.id,
      created: false
    }
  }

  const createdRef = await db.collection('users').add({
    ...data,
    createdAt: new Date().toISOString()
  })

  return {
    id: createdRef.id,
    created: true
  }
}

async function main() {
  console.log('🚀 Iniciando bootstrap del primer usuario...')

  const allPermissions = await ensurePermissions()
  console.log(`✅ Permisos asegurados: ${allPermissions.length}`)

  await ensureAdminRole(allPermissions)
  console.log('✅ Rol ADMIN asegurado')

  const result = await createOrUpdateFirstUser(allPermissions)

  console.log(result.created ? '✅ Usuario creado correctamente' : '✅ Usuario actualizado correctamente')
  console.log('----------------------------------------')
  console.log(`ID: ${result.id}`)
  console.log(`Usuario: ${FIRST_USER.usuario}`)
  console.log(`Email: ${FIRST_USER.email}`)
  console.log(`Password: ${FIRST_USER.password}`)
  console.log(`Role: ${FIRST_USER.role}`)
  console.log(`Permissions: ${allPermissions.length}`)
  console.log('----------------------------------------')
}

main().catch((error) => {
  console.error('❌ Error al crear el primer usuario')
  console.error(error)
  process.exit(1)
})