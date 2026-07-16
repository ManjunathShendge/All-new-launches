import { eventRepository } from "@/lib/supabase/event.repository";
import { EventFilter, RegisterInput, RegistrationStatus } from "@/types/event";

export class EventService {
  getEvents(filter: EventFilter) {
    return eventRepository.getPublished(filter);
  }

  getEvent(slug: string) {
    return eventRepository.getBySlug(slug);
  }

  /**
   * Register for an event. If the event is at capacity the registrant is placed
   * on the waitlist instead (they'll be notified if a spot opens).
   */
  async register(
    input: RegisterInput
  ): Promise<{ status: RegistrationStatus }> {
    const meta = await eventRepository.getCapacity(input.eventId);
    if (!meta || !meta.published) {
      throw new Error("This event is not open for registration.");
    }

    let status: RegistrationStatus = "registered";
    if (meta.capacity != null) {
      const count = await eventRepository.countRegistrations(input.eventId);
      if (count >= meta.capacity) status = "waitlisted";
    }

    await eventRepository.createRegistration(
      input.eventId,
      { name: input.name, email: input.email, phone: input.phone },
      status
    );

    // TODO(phase 2): send confirmation email / WhatsApp + calendar invite.
    return { status };
  }
}

export const eventService = new EventService();
