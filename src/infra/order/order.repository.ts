import { RepositoryInterface } from "../../domain/@shared/repository/repository.interface";
import { Order } from "../../domain/checkout/entity/order";
import { OrderItem } from "../../domain/checkout/entity/order_item";
import { OrderItemModel } from "./order-item.model";
import { OrderModel } from "./order.model";

export class OrderRepository implements RepositoryInterface<Order> {
  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({})),
      },
      {
        where: { id: entity.id },
      }
    );
    await entity.items.forEach(
      async (item) =>
        await OrderItemModel.update(
          {
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            quantity: item.quantity,
          },
          {
            where: { id: item.id },
          }
        )
    );
  }
  async find(id: string): Promise<Order> {
    const order = await OrderModel.findOne({
      where: { id },
      include: [{ model: OrderItemModel }],
    });
    const items = order.items.map(
      (item) =>
        new OrderItem(
          item.id,
          item.name,
          item.price,
          item.product_id,
          item.quantity
        )
    );

    return new Order(order.id, order.customer_id, items);
  }
  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll({
      include: [{ model: OrderItemModel }],
    });
    return orders.map((order) => {
      const items = order.items.map(
        (item) =>
          new OrderItem(
            item.id,
            item.name,
            item.price,
            item.product_id,
            item.quantity
          )
      );

      return new Order(order.id, order.customer_id, items);
    });
  }
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }
}
