# frozen_string_literal: true

class SendWeeklyDigestJob < ApplicationJob
  queue_as :default

  def perform
    User.host.where(active: true, email_notifications_enabled: true).find_each do |host|
      HostMailer.weekly_digest(host).deliver_later
    end
  end
end
