# frozen_string_literal: true

require "rails_helper"

RSpec.describe HostMailer do
  let(:host) { create(:user, :host, name: "Ana Reyes", email: "ana@example.com") }
  let(:team) { create(:team) }
  let(:emcee) { create(:user, :emcee) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  before { session.session_hosts.create!(user: host) }

  describe "#weekly_digest" do
    let(:last_week_session) do
      create(:session, team: team, created_by: emcee, date: 1.week.ago.beginning_of_week(:monday).to_date, session_slot: :slot_two)
    end

    before do
      last_week_session.session_hosts.create!(user: host)
      create(:coin_entry, session: last_week_session, user: host, coins: 15_000)
      create(:coin_entry, session: session, user: host, coins: 8_000)
    end

    let(:mail) { described_class.weekly_digest(host) }

    it "sends to the host's email" do
      expect(mail.to).to eq([ host.email ])
    end

    it "includes the week label in the subject" do
      week_start = 1.week.ago.beginning_of_week(:monday).to_date
      expect(mail.subject).to include(week_start.strftime("%b %-d"))
    end

    it "includes coins last week in the HTML body" do
      expect(mail.html_part.body.to_s).to include("15,000")
    end

    it "includes coins last week in the text body" do
      expect(mail.text_part.body.to_s).to include("15,000")
    end

    it "includes the monthly total in the HTML body" do
      expect(mail.html_part.body.to_s).to include("8,000")
    end

    it "includes a dashboard CTA link in the HTML body" do
      expect(mail.html_part.body.to_s).to include("/host")
    end

    it "includes the leaderboard rank in the HTML body" do
      expect(mail.html_part.body.to_s).to match(/#\d+/)
    end
  end

  describe "#coins_logged" do
    let(:coin_entry) { create(:coin_entry, session: session, user: host, coins: 12_000) }
    let(:mail) { described_class.coins_logged(coin_entry) }

    it "sends to the host's email" do
      expect(mail.to).to eq([ host.email ])
    end

    it "includes the session date in the subject" do
      expect(mail.subject).to include(Date.current.strftime("%B %-d, %Y"))
    end

    it "includes coins earned in the HTML body" do
      expect(mail.html_part.body.to_s).to include("12,000")
    end

    it "includes coins earned in the text body" do
      expect(mail.text_part.body.to_s).to include("12,000")
    end

    it "includes the monthly total in the HTML body" do
      other_session = create(:session, team: team, created_by: emcee, date: Date.current - 1.day)
      other_session.session_hosts.create!(user: host)
      create(:coin_entry, session: other_session, user: host, coins: 8_000)

      expect(mail.html_part.body.to_s).to include("20,000")
    end

    it "includes the slot label in the HTML body" do
      expect(mail.html_part.body.to_s).to include("First Slot")
    end
  end
end
