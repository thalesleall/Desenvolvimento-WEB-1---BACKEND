// src/interfaces/product.interface.ts
export interface Product {
  _id?: import('mongodb').ObjectId; // O ID será adicionado pelo MongoDB
  Nome: string;
  Descrição: string;
  Cor: string;
  Peso: string; // Mantido como string conforme exemplo "20g"
  Tipo: string;
  Preço: number; // Preço geralmente é numérico
  DataCadastro: Date; // Armazenar como Date no MongoDB é mais flexível
}