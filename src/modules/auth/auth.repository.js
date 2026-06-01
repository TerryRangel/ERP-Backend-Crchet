import { db } from '../../config/firebase.js'

const COLLECTION = 'users'

export class AuthRepository {
  async findByUsuario(usuario) {
    const snapshot = await db
      .collection(COLLECTION)
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

  async findById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get()

    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data()
    }
  }


  // Agregar en UsersRepository
  async findByResetToken(token) {
    const snapshot = await db
      .collection(COLLECTION)
      .where('resetPasswordToken', '==', token)
      .where('resetPasswordExpires', '>', Date.now()) // Validar que no haya expirado
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    }
  }
}

export const authRepository = new AuthRepository()