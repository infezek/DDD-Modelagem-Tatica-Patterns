import { Order } from "../entity/order";

export class OrderService {
  static total(orders: Order[]): number {
    return orders.reduce((acc, order) => order.total() + acc, 0);
  }
}
