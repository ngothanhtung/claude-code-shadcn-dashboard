import { FirebaseError } from "firebase/app"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"

import { auth } from "@/lib/firebase/client"

export async function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  displayName: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  return credential
}

export function getFirebaseAuthErrorMessage(error: unknown, mode: "signin" | "signup" = "signin") {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return mode === "signup"
          ? "Email hoặc mật khẩu không hợp lệ."
          : "Email hoặc mật khẩu không đúng."
      case "auth/invalid-email":
        return "Email không hợp lệ."
      case "auth/email-already-in-use":
        return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác."
      case "auth/weak-password":
        return "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự."
      case "auth/too-many-requests":
        return "Thao tác thất bại quá nhiều lần. Vui lòng thử lại sau."
      case "auth/network-request-failed":
        return "Không thể kết nối Firebase. Vui lòng kiểm tra mạng và thử lại."
      default:
        return mode === "signup"
          ? "Không thể đăng ký. Vui lòng thử lại."
          : "Không thể đăng nhập. Vui lòng thử lại."
    }
  }

  return mode === "signup"
    ? "Không thể đăng ký. Vui lòng thử lại."
    : "Không thể đăng nhập. Vui lòng thử lại."
}
