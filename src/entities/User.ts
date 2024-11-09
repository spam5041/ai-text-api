import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('app_user')
export class User {
    // Primary key
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // User email (unique)
    @Column({ unique: true })
    email!: string;

    // Hashed password
    @Column()
    password!: string;

    // User balance in credits
    @Column({ type: 'integer', default: 0 })
    credits!: number;

    // User role (user/admin)
    @Column({ default: "user" })
    role!: string;

    // Timestamps
    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Constructor for partial initialization
    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
} 