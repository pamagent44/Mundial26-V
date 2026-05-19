const handleChangeOwnPassword = async () => {
  if (!currentPassword) {
    setUserError('Debes ingresar tu contraseña actual')
    return
  }
  
  if (!newPasswordAdmin || newPasswordAdmin.length < 6) {
    setUserError('La nueva contraseña debe tener al menos 6 caracteres')
    return
  }
  
  if (newPasswordAdmin !== confirmPasswordAdmin) {
    setUserError('Las contraseñas nuevas no coinciden')
    return
  }
  
  // Obtener usuario actual del localStorage para verificar contraseña
  const storedUser = localStorage.getItem('user')
  const userData = storedUser ? JSON.parse(storedUser) : null
  
  if (currentPassword !== userData?.password) {
    setUserError('Contraseña actual incorrecta')
    return
  }
  
  setSyncing(true)
  try {
    await updatePassword(currentUser!.username, newPasswordAdmin)
    
    const updatedUser = { ...currentUser, password: newPasswordAdmin, must_change_password: false }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setCurrentUser(updatedUser)
    
    setSyncMessage('✅ Tu contraseña ha sido actualizada correctamente')
    setShowChangePasswordModal(false)
    setCurrentPassword('')
    setNewPasswordAdmin('')
    setConfirmPasswordAdmin('')
    
    setTimeout(() => setSyncMessage(''), 3000)
  } catch (err: any) {
    setUserError(err.message || 'Error cambiando contraseña')
  } finally {
    setSyncing(false)
  }
}