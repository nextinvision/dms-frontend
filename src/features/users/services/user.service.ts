import { userRepository } from "@/core/repositories/user.repository";
import type { User, CreateUserDto } from "@/shared/types/user.types";

class UserService {
    async getAll(): Promise<User[]> {
        return userRepository.getAll();
    }

    async getById(id: string): Promise<User> {
        return userRepository.getById(id);
    }

    async create(data: CreateUserDto): Promise<User> {
        return userRepository.create(data as unknown as Partial<User>);
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        return userRepository.update(id, data);
    }

    async delete(id: string): Promise<void> {
        return userRepository.delete(id);
    }
}

export const userService = new UserService();
