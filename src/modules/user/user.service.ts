import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from '../auth/password.service';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  birthDate?: string;
  avatarUrl?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchUsersOptions {
  query?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly databaseService: DatabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  async registerUser(registerUserDto: RegisterUserDto): Promise<User> {
    const { email, password, username, displayName, birthDate } = registerUserDto;

    // Check if email already exists
    const existingUserByEmail = await this.databaseService.getUserByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUserByUsername = await this.getUserByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create user
    const userData = {
      email,
      password_hash: hashedPassword,
      username,
      display_name: displayName,
      birth_date: birthDate,
      role: 'user',
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const { data, error } = await this.databaseService
        .getAdminClient()
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating user:', error);
        throw error;
      }

      this.logger.log(`User registered successfully: ${email}`, 'UserService');

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        birthDate: data.birth_date,
        avatarUrl: data.avatar_url,
        role: data.role,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      this.logger.error('Exception in registerUser:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const userData = await this.databaseService.getUserById(id);
    if (!userData) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      displayName: userData.display_name,
      birthDate: userData.birth_date,
      avatarUrl: userData.avatar_url,
      role: userData.role,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await this.databaseService
        .getAdminClient()
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        this.logger.error('Error fetching user by username:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        birthDate: data.birth_date,
        avatarUrl: data.avatar_url,
        role: data.role,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      this.logger.error('Exception in getUserByUsername:', error);
      throw error;
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check username uniqueness if updating username
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const userWithSameUsername = await this.getUserByUsername(updateUserDto.username);
      if (userWithSameUsername && userWithSameUsername.id !== id) {
        throw new ConflictException('Username already taken');
      }
    }

    const updateData = {
      ...(updateUserDto.username && { username: updateUserDto.username }),
      ...(updateUserDto.displayName && { display_name: updateUserDto.displayName }),
      ...(updateUserDto.birthDate && { birth_date: updateUserDto.birthDate }),
      updated_at: new Date(),
    };

    try {
      const { data, error } = await this.databaseService
        .getAdminClient()
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error('Error updating user:', error);
        throw error;
      }

      this.logger.log(`User updated successfully: ${id}`, 'UserService');

      return {
        id: data.id,
        email: data.email,
        username: data.username,
        displayName: data.display_name,
        birthDate: data.birth_date,
        avatarUrl: data.avatar_url,
        role: data.role,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      this.logger.error('Exception in updateUser:', error);
      throw error;
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.databaseService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.validatePassword(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.passwordService.hashPassword(newPassword);

    try {
      const { error } = await this.databaseService
        .getAdminClient()
        .from('users')
        .update({
          password_hash: hashedNewPassword,
          updated_at: new Date(),
        })
        .eq('id', id);

      if (error) {
        this.logger.error('Error changing password:', error);
        throw error;
      }

      this.logger.log(`Password changed successfully for user: ${id}`, 'UserService');
    } catch (error) {
      this.logger.error('Exception in changePassword:', error);
      throw error;
    }
  }

  async uploadAvatar(id: string, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload file to Supabase storage
    const fileName = `avatars/${id}/${Date.now()}_${file.originalname}`;
    
    try {
      const { data, error } = await this.databaseService
        .getClient()
        .storage
        .from('user-avatars')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error('Error uploading avatar:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.databaseService
        .getClient()
        .storage
        .from('user-avatars')
        .getPublicUrl(data.path);

      const avatarUrl = urlData.publicUrl;

      // Update user with new avatar URL
      await this.databaseService
        .getAdminClient()
        .from('users')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date(),
        })
        .eq('id', id);

      this.logger.log(`Avatar uploaded successfully for user: ${id}`, 'UserService');

      return { avatarUrl };
    } catch (error) {
      this.logger.error('Exception in uploadAvatar:', error);
      throw error;
    }
  }

  async deleteAvatar(id: string): Promise<void> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatarUrl) {
      throw new BadRequestException('No avatar to delete');
    }

    try {
      // Extract file path from URL
      const url = new URL(user.avatarUrl);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      // Delete from storage
      const { error: deleteError } = await this.databaseService
        .getClient()
        .storage
        .from('user-avatars')
        .remove([filePath]);

      if (deleteError) {
        this.logger.error('Error deleting avatar from storage:', deleteError);
        // Continue to update database even if storage deletion fails
      }

      // Update user to remove avatar URL
      await this.databaseService
        .getAdminClient()
        .from('users')
        .update({
          avatar_url: null,
          updated_at: new Date(),
        })
        .eq('id', id);

      this.logger.log(`Avatar deleted successfully for user: ${id}`, 'UserService');
    } catch (error) {
      this.logger.error('Exception in deleteAvatar:', error);
      throw error;
    }
  }

  async searchUsers(options: SearchUsersOptions = {}): Promise<{ users: User[]; total: number }> {
    const { query, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    try {
      let queryBuilder = this.databaseService
        .getAdminClient()
        .from('users')
        .select('*', { count: 'exact' });

      if (query) {
        queryBuilder = queryBuilder.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
      }

      const { data, error, count } = await queryBuilder
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Error searching users:', error);
        throw error;
      }

      const users = data.map(userData => ({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        displayName: userData.display_name,
        birthDate: userData.birth_date,
        avatarUrl: userData.avatar_url,
        role: userData.role,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      }));

      return { users, total: count || 0 };
    } catch (error) {
      this.logger.error('Exception in searchUsers:', error);
      throw error;
    }
  }
}