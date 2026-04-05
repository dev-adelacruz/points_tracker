# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendWeeklyDigestJob do
  let(:active_host_with_notifications) { create(:user, :host, active: true, email_notifications_enabled: true) }
  let(:active_host_no_notifications) { create(:user, :host, active: true, email_notifications_enabled: false) }
  let(:inactive_host) { create(:user, :host, active: false, email_notifications_enabled: true) }

  before do
    active_host_with_notifications
    active_host_no_notifications
    inactive_host
  end

  it "enqueues weekly digest emails for active hosts with notifications enabled" do
    expect {
      described_class.perform_now
    }.to have_enqueued_mail(HostMailer, :weekly_digest).with(active_host_with_notifications).once
  end

  it "does not enqueue for hosts with email notifications disabled" do
    expect {
      described_class.perform_now
    }.not_to have_enqueued_mail(HostMailer, :weekly_digest).with(active_host_no_notifications)
  end

  it "does not enqueue for inactive hosts" do
    expect {
      described_class.perform_now
    }.not_to have_enqueued_mail(HostMailer, :weekly_digest).with(inactive_host)
  end
end
