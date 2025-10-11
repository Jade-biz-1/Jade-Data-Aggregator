"""
Middleware to protect admin user from modifications by developer role.
Ensures that developer role users cannot modify the admin user account.
"""

from fastapi import HTTPException, status
from backend.schemas.user import User, UserRole
from backend.core.permissions import is_admin_user


def check_admin_user_protection(current_user: User, target_username: str, operation: str = "modify"):
    """
    Check if the operation on target user is allowed.
    Prevents developer role from modifying admin user.

    Args:
        current_user: The user attempting the operation
        target_username: Username of the target user
        operation: Type of operation (modify, delete, reset_password, etc.)

    Raises:
        HTTPException: If operation is not allowed
    """
    # Admin users can do anything
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return

    # Developer role cannot modify admin user
    if current_user.role == UserRole.DEVELOPER and is_admin_user(target_username):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Developer role cannot {operation} the admin user account. "
                   "Only administrators can modify the admin user."
        )

    # Other roles shouldn't reach here (RBAC should block them)
    # But just in case, block non-admin/developer from user management
    if current_user.role not in [UserRole.ADMIN, UserRole.DEVELOPER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for user management operations."
        )


def check_can_modify_user(current_user: User, target_user_id: int, target_username: str):
    """
    Check if current user can modify target user.

    Args:
        current_user: The user attempting modification
        target_user_id: ID of target user
        target_username: Username of target user

    Raises:
        HTTPException: If modification is not allowed
    """
    # Admin can modify anyone (including themselves for password changes)
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        return

    # Developer can modify anyone except admin user
    if current_user.role == UserRole.DEVELOPER:
        check_admin_user_protection(current_user, target_username, "modify")
        return

    # Other roles cannot modify users (should be caught by RBAC)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions for user modification."
    )


def check_can_delete_user(current_user: User, target_user_id: int, target_username: str):
    """
    Check if current user can delete target user.

    Args:
        current_user: The user attempting deletion
        target_user_id: ID of target user
        target_username: Username of target user

    Raises:
        HTTPException: If deletion is not allowed
    """
    # Prevent self-deletion
    if current_user.id == target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account."
        )

    # Admin can delete anyone except admin user
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        # Even admin cannot delete the 'admin' user itself
        if is_admin_user(target_username):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete the default admin user account for security reasons."
            )
        return

    # Developer cannot delete admin user
    if current_user.role == UserRole.DEVELOPER:
        check_admin_user_protection(current_user, target_username, "delete")
        return

    # Other roles cannot delete users
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions for user deletion."
    )


def check_can_reset_password(current_user: User, target_username: str):
    """
    Check if current user can reset target user's password.

    Args:
        current_user: The user attempting password reset
        target_username: Username of target user

    Raises:
        HTTPException: If password reset is not allowed
    """
    # Admin can reset anyone's password except the admin user itself (via this endpoint)
    # Admin should use "change password" instead
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        if is_admin_user(target_username):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot reset password for admin user via this endpoint. "
                       "Admin should use 'Change Password' functionality instead."
            )
        return

    # Developer cannot reset admin user's password
    if current_user.role == UserRole.DEVELOPER:
        check_admin_user_protection(current_user, target_username, "reset password for")
        return

    # Other roles cannot reset passwords
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions for password reset."
    )


def check_can_activate_deactivate(current_user: User, target_user_id: int, target_username: str, operation: str):
    """
    Check if current user can activate/deactivate target user.

    Args:
        current_user: The user attempting the operation
        target_user_id: ID of target user
        target_username: Username of target user
        operation: "activate" or "deactivate"

    Raises:
        HTTPException: If operation is not allowed
    """
    # Prevent self-deactivation
    if operation == "deactivate" and current_user.id == target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account."
        )

    # Admin can activate/deactivate anyone except admin user
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        if is_admin_user(target_username):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot {operation} the default admin user account."
            )
        return

    # Developer cannot activate/deactivate admin user
    if current_user.role == UserRole.DEVELOPER:
        check_admin_user_protection(current_user, target_username, operation)
        return

    # Other roles cannot activate/deactivate users
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Insufficient permissions to {operation} users."
    )


def check_can_assign_role(current_user: User, target_username: str, new_role: UserRole):
    """
    Check if current user can assign a specific role to target user.

    Args:
        current_user: The user attempting role assignment
        target_username: Username of target user
        new_role: The role being assigned

    Raises:
        HTTPException: If role assignment is not allowed
    """
    # Only admin can assign roles
    if current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        # Developer can assign roles except developer and admin roles
        if current_user.role == UserRole.DEVELOPER:
            if new_role in [UserRole.ADMIN, UserRole.DEVELOPER]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Developer role cannot assign Admin or Developer roles. "
                           "Only administrators can assign these sensitive roles."
                )
            # Developer cannot modify admin user at all
            check_admin_user_protection(current_user, target_username, "assign role to")
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for role assignment."
            )

    # Admin cannot change the admin user's role
    if is_admin_user(target_username):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot change the role of the default admin user account."
        )
